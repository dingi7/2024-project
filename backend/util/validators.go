package util

import (
	"errors"
	"reflect"
)

// validateStructFields checks if any of the fields in a struct are missing (i.e., set to their zero value).
func ValidateStructFields(model interface{}) error {
	v := reflect.ValueOf(model)

	// Ensure that we are working with a pointer to a struct.
	if v.Kind() != reflect.Ptr || v.Elem().Kind() != reflect.Struct {
		return errors.New("expected a pointer to a struct")
	}

	v = v.Elem()
	typeOfModel := v.Type()

	for i := 0; i < v.NumField(); i++ {
		field := v.Field(i)
		fieldName := typeOfModel.Field(i).Name

		// Check if the field is the zero value (indicating it's missing)
		if isZeroValue(field) {
			return errors.New("missing required field: " + fieldName)
		}
	}
	return nil
}

// isZeroValue checks if the given reflect.Value is the zero value for its type.
func isZeroValue(field reflect.Value) bool {
	return field.Interface() == reflect.Zero(field.Type()).Interface()
}
